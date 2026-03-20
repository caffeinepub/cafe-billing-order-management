import Array "mo:core/Array";
import Text "mo:core/Text";



actor {
  type OrderItem = {
    menuItemId : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
  };

  type Order = {
    id : Text;
    orderNumber : Text;
    dateTime : Text;
    items : [OrderItem];
    total : Nat;
    paymentType : Text;
  };

  type MenuItem = {
    id : Text;
    name : Text;
    price : Nat;
  };

  type Category = {
    id : Text;
    name : Text;
    items : [MenuItem];
  };

  stable var orders : [Order] = [];
  stable var menu : [Category] = [];
  stable var counter : Nat = 1;

  public shared ({ caller }) func login(username : Text, password : Text) : async Bool {
    username == "simplesips" and password == "simplesips@03";
  };

  public query ({ caller }) func getOrders() : async [Order] {
    orders;
  };

  public shared ({ caller }) func addOrder(order : Order) : async Bool {
    orders := orders.concat([order]);
    true;
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async Bool {
    orders := orders.filter(func(o) { o.id != id });
    true;
  };

  public shared ({ caller }) func deleteOrdersByDate(dateKey : Text) : async Nat {
    let originalSize = orders.size();
    orders := orders.filter(func(o) { not o.dateTime.startsWith(#text dateKey) });
    originalSize - orders.size();
  };

  public shared ({ caller }) func updateOrderPayment(id : Text, paymentType : Text) : async Bool {
    orders := orders.map(func(o : Order) : Order {
      if (o.id == id) {
        { id = o.id; orderNumber = o.orderNumber; dateTime = o.dateTime; items = o.items; total = o.total; paymentType = paymentType }
      } else {
        o
      }
    });
    true;
  };

  public query ({ caller }) func getMenu() : async [Category] {
    menu;
  };

  public shared ({ caller }) func saveMenu(newMenu : [Category]) : async Bool {
    menu := newMenu;
    true;
  };

  public shared ({ caller }) func getNextOrderNumber() : async Nat {
    let current = counter;
    counter += 1;
    current;
  };
};
