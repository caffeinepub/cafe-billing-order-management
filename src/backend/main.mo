import List "mo:core/List";
import Migration "migration";

(with migration = Migration.run)
actor {

  type OrderItem = {
    menuItemId : Text;
    name       : Text;
    price      : Nat;
    quantity   : Nat;
  };

  type Order = {
    id          : Text;
    orderNumber : Text;
    dateTime    : Text;
    items       : [OrderItem];
    total       : Nat;
    paymentType : Text;
  };

  type MenuItem = {
    id    : Text;
    name  : Text;
    price : Nat;
  };

  type Category = {
    id    : Text;
    name  : Text;
    items : [MenuItem];
  };

  // Persistent state — enhanced orthogonal persistence, no stable keyword needed
  let orders  : List.List<Order>    = List.empty<Order>();
  let menu    : List.List<Category> = List.empty<Category>();
  var counter : Nat                 = 1;

  public shared func login(username : Text, password : Text) : async Bool {
    username == "simplesips" and password == "simplesips@03"
  };

  public query func getOrders() : async [Order] {
    orders.toArray()
  };

  public shared func addOrder(order : Order) : async Bool {
    orders.add(order);
    true
  };

  public shared func deleteOrder(id : Text) : async Bool {
    let kept = orders.filter(func(o : Order) : Bool { o.id != id });
    orders.clear();
    orders.append(kept);
    true
  };

  public shared func deleteOrdersByDate(dateKey : Text) : async Nat {
    let before = orders.size();
    let kept = orders.filter(func(o : Order) : Bool {
      not o.dateTime.startsWith(#text dateKey)
    });
    orders.clear();
    orders.append(kept);
    before - orders.size()
  };

  public shared func updateOrderPayment(id : Text, paymentType : Text) : async Bool {
    orders.mapInPlace(func(o : Order) : Order {
      if (o.id == id) { { o with paymentType = paymentType } } else { o }
    });
    true
  };

  public query func getMenu() : async [Category] {
    menu.toArray()
  };

  public shared func saveMenu(newMenu : [Category]) : async Bool {
    menu.clear();
    menu.addAll(newMenu.values());
    true
  };

  public shared func getNextOrderNumber() : async Nat {
    let current = counter;
    counter += 1;
    current
  };

};
