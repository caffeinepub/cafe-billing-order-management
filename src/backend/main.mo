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

  public shared func login(username : Text, password : Text) : async Bool {
    username == "simplesips" and password == "simplesips@03";
  };

  public query func getOrders() : async [Order] {
    orders;
  };

  public shared func addOrder(order : Order) : async Bool {
    orders := orders.concat([order]);
    true;
  };

  public shared func deleteOrder(id : Text) : async Bool {
    orders := orders.filter(func(o : Order) : Bool { o.id != id });
    true;
  };

  public shared func deleteOrdersByDate(dateKey : Text) : async Nat {
    let originalSize = orders.size();
    orders := orders.filter(func(o : Order) : Bool {
      not o.dateTime.startsWith(#text dateKey);
    });
    originalSize - orders.size();
  };

  public shared func updateOrderPayment(id : Text, paymentType : Text) : async Bool {
    orders := orders.map(func(o : Order) : Order {
      if (o.id == id) {
        { id = o.id; orderNumber = o.orderNumber; dateTime = o.dateTime; items = o.items; total = o.total; paymentType = paymentType };
      } else {
        o;
      };
    });
    true;
  };

  public query func getMenu() : async [Category] {
    menu;
  };

  public shared func saveMenu(newMenu : [Category]) : async Bool {
    menu := newMenu;
    true;
  };

  public shared func getNextOrderNumber() : async Nat {
    let current = counter;
    counter += 1;
    current;
  };
};
